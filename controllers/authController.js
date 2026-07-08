import bcrypt from 'bcrypt';
import User from '../models/User.js';

export const getRegister = (req, res) => {
  res.render('auth/register');
};

export const postRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'An account with this email already exists');
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    req.session.userId = newUser._id;

    req.flash('success', 'Account created successfully');
    res.redirect('/resources');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/register');
  }
};

export const getLogin = (req, res) => {
  res.render('auth/login');
};

export const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    req.session.userId = user._id;

    req.flash('success', 'Logged in successfully');
    res.redirect('/resources');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/login');
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.redirect('/resources');
    }
    res.redirect('/login');
  });
};
