import Resource from '../models/Resource.js';
import User from '../models/User.js';

export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    req.flash('error', 'Please log in to do that.');
    return res.redirect('/login');
  }
  next();
};

// Assumes requireAuth already ran, and res.locals.currentUser was populated
// by the global middleware in app.js.
export const requireAdmin = (req, res, next) => {
  if (!res.locals.currentUser || res.locals.currentUser.role !== 'admin') {
    req.flash('error', 'Admin access required.');
    return res.redirect('/resources');
  }
  next();
};

export const requireOwnership = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      req.flash('error', 'Resource not found.');
      return res.redirect('/resources');
    }

    const user = await User.findById(req.session.userId);

    if (resource.uploadedBy.toString() !== req.session.userId && user.role !== 'admin') {
      req.flash('error', 'You are not authorized to do that.');
      return res.redirect('/resources');
    }

    req.resource = resource;
    next();
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong.');
    res.redirect('/resources');
  }
};
