import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';
import connectDB from './config/db.js';
import User from './models/User.js';
import indexRoutes from './routes/indexRoutes.js';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

// Required on Render/Railway/Heroku-style platforms: they sit behind a reverse
// proxy, so Express needs this to correctly detect HTTPS and set secure cookies.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24, // 1 day, matches cookie maxAge below
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === 'production', // HTTPS-only cookie in production
    },
  })
);

app.use(flash());

// Make flash messages and the full logged-in user document available in every view
app.use(async (req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');

  if (req.session.userId) {
    try {
      res.locals.currentUser = await User.findById(req.session.userId);
    } catch (error) {
      console.error(error);
      res.locals.currentUser = null;
    }
  } else {
    res.locals.currentUser = null;
  }

  next();
});

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', resourceRoutes);
app.use('/', profileRoutes);
app.use('/', adminRoutes);

// Must come after all routes: catches unmatched paths (404), then any error passed via next(err)
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
