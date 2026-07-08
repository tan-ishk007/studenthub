import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Resource from '../models/Resource.js';

export const showProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const uploads = await Resource.find({ uploadedBy: req.session.userId }).sort({ createdAt: -1 });

    res.render('profile/show', {
      profileUser: user,
      uploads,
      uploadCount: uploads.length,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong loading your profile.');
    res.redirect('/resources');
  }
};

export const updateName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      req.flash('error', 'Name cannot be empty.');
      return res.redirect('/profile');
    }

    await User.findByIdAndUpdate(req.session.userId, { name: name.trim() });

    req.flash('success', 'Name updated successfully.');
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong updating your name.');
    res.redirect('/profile');
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash('error', 'New passwords do not match.');
      return res.redirect('/profile');
    }

    const user = await User.findById(req.session.userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      req.flash('error', 'Current password is incorrect.');
      return res.redirect('/profile');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    req.flash('success', 'Password updated successfully.');
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong updating your password.');
    res.redirect('/profile');
  }
};
