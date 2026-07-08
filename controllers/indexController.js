import Resource from '../models/Resource.js';
import User from '../models/User.js';

export const getHome = async (req, res, next) => {
  try {
    const [resourceCount, userCount] = await Promise.all([
      Resource.countDocuments(),
      User.countDocuments(),
    ]);

    res.render('index', { resourceCount, userCount });
  } catch (error) {
    next(error);
  }
};
