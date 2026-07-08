import User from '../models/User.js';
import Resource from '../models/Resource.js';

// Pre-fix uploads stored PDFs/docs under Cloudinary's `image` resource_type,
// which now 401s on delivery. Any file that isn't a jpg/png but whose URL
// path contains `/image/upload/` was uploaded before the `raw` vs `image` fix.
function isBrokenFileUrl(resource) {
  const isImageFile = /\.(jpe?g|png)$/i.test(resource.fileName || '');
  return !isImageFile && resource.fileUrl.includes('/image/upload/');
}

export const adminDashboard = async (req, res, next) => {
  try {
    const [users, resourcesRaw, userCount, resourceCount, adminCount] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Resource.find().populate('uploadedBy', 'name email').sort({ createdAt: -1 }).limit(50),
      User.countDocuments(),
      Resource.countDocuments(),
      User.countDocuments({ role: 'admin' }),
    ]);

    const resources = resourcesRaw.map((resource) => ({
      ...resource.toObject(),
      broken: isBrokenFileUrl(resource),
    }));
    const brokenCount = resources.filter((r) => r.broken).length;

    res.render('admin/dashboard', {
      users,
      resources,
      stats: { userCount, resourceCount, adminCount, brokenCount },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAdminRole = async (req, res, next) => {
  try {
    if (req.params.id === req.session.userId) {
      req.flash('error', "You can't change your own admin status.");
      return res.redirect('/admin');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin');
    }

    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();

    req.flash('success', `${user.name} is now ${user.role === 'admin' ? 'an admin' : 'a regular user'}.`);
    res.redirect('/admin');
  } catch (error) {
    if (error.name === 'CastError') {
      return next(error);
    }
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.session.userId) {
      req.flash('error', "You can't delete your own account from here.");
      return res.redirect('/admin');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin');
    }

    const { deletedCount } = await Resource.deleteMany({ uploadedBy: user._id });
    await user.deleteOne();

    req.flash('success', `Deleted ${user.name} and ${deletedCount} of their resource${deletedCount === 1 ? '' : 's'}.`);
    res.redirect('/admin');
  } catch (error) {
    if (error.name === 'CastError') {
      return next(error);
    }
    next(error);
  }
};
