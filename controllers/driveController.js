import DriveResource from "../models/DriveResource.js";

export const getSemesters = async (req, res) => {
  try {
    const semesters = await DriveResource.distinct("semester");

    semesters.sort((a, b) => a - b);

    res.json(semesters);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

export const getSubjects = async (req, res) => {
  try {
    const semester = Number(req.params.semester);

    const subjects = await DriveResource.distinct("subject", {
      semester,
    });

    subjects.sort();

    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

export const getResources = async (req, res) => {
  try {
    const semester = Number(req.params.semester);
    const subject = decodeURIComponent(req.params.subject);

    const resources = await DriveResource.find({
      semester,
      subject,
    }).sort({ title: 1 });

    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
