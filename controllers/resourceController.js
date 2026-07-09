import path from 'path';
import { Readable } from 'stream';
import Resource from '../models/Resource.js';
import { RESOURCE_CATEGORIES, BRANCHES } from '../config/constants.js';

export const listResources = async (req, res) => {
  try {
    const { subject, branch, semester, category, search, page } = req.query;
    const filter = {};

    if (subject) {
      filter.subject = { $regex: subject, $options: 'i' };
    }
    if (branch) {
      filter.branch = branch;
    }
    if (semester) {
      filter.semester = semester;
    }
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const currentPage = Math.max(parseInt(page) || 1, 1);
    const perPage = 9;

    const totalResources = await Resource.countDocuments(filter);
    const totalPages = Math.ceil(totalResources / perPage);

    const resources = await Resource.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.render('resources/index', {
      resources,
      query: req.query,
      currentPage,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong loading resources.');
    res.redirect('/');
  }
};

export const newResourceForm = (req, res) => {
  res.render('resources/new', { categories: RESOURCE_CATEGORIES, branches: BRANCHES });
};

export const createResource = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Please select a file to upload.');
      return res.redirect('/resources/new');
    }

    const { title, description, subject, branch, semester, year, category } = req.body;

    await Resource.create({
      title,
      description,
      subject,
      branch,
      semester,
      year: year || undefined,
      category,
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      uploadedBy: req.session.userId,
    });

    req.flash('success', 'Resource uploaded successfully!');
    res.redirect('/resources');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong while uploading. Please try again.');
    res.redirect('/resources/new');
  }
};

export const showResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('uploadedBy', 'name');

    if (!resource) {
      const error = new Error("That resource doesn't exist, or the link is invalid.");
      error.status = 404;
      return next(error);
    }

    res.render('resources/show', { resource });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(error); // malformed/bad ID -> let the global error handler render the styled 404
    }
    console.error(error);
    req.flash('error', 'Something went wrong.');
    res.redirect('/resources');
  }
};

export const downloadResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      const error = new Error("That resource doesn't exist, or the link is invalid.");
      error.status = 404;
      return next(error);
    }

    const upstream = await fetch(resource.fileUrl);
    if (!upstream.ok || !upstream.body) {
      const error = new Error('The file could not be retrieved from storage. Try again shortly.');
      error.status = 502;
      return next(error);
    }

    // Build "<resource title>.<original extension>" so the browser always
    // downloads with a sensible name, regardless of Cloudinary's internal filename.
    const ext = path.extname(resource.fileName) || '';
    const safeTitle = resource.title.replace(/[\\/:*?"<>|]/g, '').trim() || 'download';
    const downloadName = `${safeTitle}${ext}`;

    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    if (error.name === 'CastError') {
      return next(error);
    }
    next(error);
  }
};

export const editResourceForm = (req, res) => {
  res.render('resources/edit', { resource: req.resource, categories: RESOURCE_CATEGORIES, branches: BRANCHES });
};

export const updateResource = async (req, res) => {
  try {
    const { title, description, subject, branch, semester, year, category } = req.body;

    req.resource.title = title;
    req.resource.description = description;
    req.resource.subject = subject;
    req.resource.branch = branch;
    req.resource.semester = semester;
    req.resource.year = year || undefined;
    req.resource.category = category;

    if (req.file) {
      req.resource.fileUrl = req.file.path;
      req.resource.fileName = req.file.originalname;
    }

    await req.resource.save();

    req.flash('success', 'Resource updated successfully!');
    res.redirect(`/resources/${req.resource._id}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong while updating.');
    res.redirect(`/resources/${req.params.id}/edit`);
  }
};

export const deleteResource = async (req, res) => {
  try {
    await req.resource.deleteOne();
    req.flash('success', 'Resource deleted.');
    res.redirect('/my-resources');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong while deleting.');
    res.redirect('/my-resources');
  }
};

export const myResources = async (req, res) => {
  try {
    const resources = await Resource.find({ uploadedBy: req.session.userId })
      .sort({ createdAt: -1 });

    res.render('resources/my-resources', { resources });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong.');
    res.redirect('/resources');
  }
};
