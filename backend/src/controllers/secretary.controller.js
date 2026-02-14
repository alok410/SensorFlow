import User from "../models/User.js";
import bcrypt from "bcryptjs";

/* ===============================
   CREATE SECRETARY
=================================*/
export const createSecretary = async (req, res) => {
  try {
    const { email, password, name, phone, locationId } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const secretary = new User({
      email,
      password: hashedPassword,
      name,
      phone,
      locationId,
      role: "secretary", // 🔥 Force role
    });

    await secretary.save();

    res.status(201).json({
      message: "Secretary created successfully",
      data: secretary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   GET ALL SECRETARIES
=================================*/
export const getAllSecretaries = async (req, res) => {
  try {
    const secretaries = await User.find({ role: "secretary" })
      .select("-password") // hide password
      .populate("locationId");

    res.status(200).json(secretaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   GET SECRETARY BY ID
=================================*/
export const getSecretaryById = async (req, res) => {
  try {
    const { id } = req.params;

    const secretary = await User.findOne({
      _id: id,
      role: "secretary",
    })
      .select("-password")
      .populate("locationId");

    if (!secretary) {
      return res.status(404).json({ message: "Secretary not found" });
    }

    res.status(200).json(secretary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   UPDATE SECRETARY
=================================*/
export const updateSecretary = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedSecretary = await User.findOneAndUpdate(
      { _id: id, role: "secretary" }, // ensure role
      req.body,
      { new: true }
    ).select("-password");

    if (!updatedSecretary) {
      return res.status(404).json({ message: "Secretary not found" });
    }

    res.status(200).json({
      message: "Secretary updated successfully",
      data: updatedSecretary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   DELETE SECRETARY
=================================*/
export const deleteSecretary = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSecretary = await User.findOneAndDelete({
      _id: id,
      role: "secretary",
    });

    if (!deletedSecretary) {
      return res.status(404).json({ message: "Secretary not found" });
    }

    res.status(200).json({
      message: "Secretary deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
