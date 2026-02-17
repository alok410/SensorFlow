import User from "../models/User.js";
import bcrypt from "bcryptjs";

/* ===============================
   ADMIN: CREATE CONSUMER
=================================*/
export const createConsumer = async (req, res) => {
  try {
    const { email, password, name, phone, locationId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const consumer = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      locationId,
      role: "consumer",
    });

    res.status(201).json({
      success: true,
      message: "Consumer created successfully",
      data: {
        _id: consumer._id,
        email: consumer.email,
        name: consumer.name,
        phone: consumer.phone,
        locationId: consumer.locationId,
        role: consumer.role,
        createdAt: consumer.createdAt,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



/* ===============================
   ADMIN: GET ALL CONSUMERS
=================================*/
export const getAllConsumers = async (req, res) => {
  try {
    const consumers = await User.find({ role: "consumer" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: consumers.length,
      data: consumers,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};







/* ===============================
   ADMIN: UPDATE CONSUMER
=================================*/
export const updateConsumer = async (req, res) => {
  try {
    delete req.body.role; // prevent role change

    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, role: "consumer" },
      req.body,
      { new: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Consumer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Consumer updated successfully",
      data: updated,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



/* ===============================
   ADMIN: DELETE CONSUMER
=================================*/
export const deleteConsumer = async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({
      _id: req.params.id,
      role: "consumer",
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Consumer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Consumer deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
