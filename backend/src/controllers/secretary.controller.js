import User from "../models/User.js";
import bcrypt from "bcryptjs";

/* CREATE SECRETARY */
export const createSecretary = async (req, res) => {
  try {
    const { email, password, name, phone, locationId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const secretary = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      locationId,
      role: "secretary",
    });

    res.status(201).json(secretary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* GET ALL SECRETARIES */
export const getAllSecretaries = async (req, res) => {
  try {
    const secretaries = await User.find({ role: "secretary" })
      .select("-password")
      .populate("locationId");

    res.json(secretaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* GET MY PROFILE (for secretary) */
export const getMyProfile = async (req, res) => {
  try {
    const secretary = await User.findById(req.user._id)
      .select("-password")
      .populate("locationId");

    res.json(secretary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* UPDATE SECRETARY */
export const updateSecretary = async (req, res) => {
  try {
    delete req.body.role;

    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, role: "secretary" },
      req.body,
      { new: true }
    ).select("-password");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* DELETE SECRETARY */
export const deleteSecretary = async (req, res) => {
  try {
    await User.findOneAndDelete({
      _id: req.params.id,
      role: "secretary",
    });

    res.json({ message: "Secretary deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
