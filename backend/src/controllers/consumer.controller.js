import User from "../models/User.js";
import bcrypt from "bcryptjs";

/* =================================
   ADMIN: CREATE CONSUMER
=================================*/export const createConsumer = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      locationId, 
      meterId, 
      serialNumber,
      blockId   // ✅ ADD THIS
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const consumer = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      locationId,
      meterId,
      serialNumber,
      blockId,   // ✅ now defined
      role: "consumer",
    });

    res.status(201).json({
      success: true,
      message: "Consumer created successfully",
      data: {
        id: consumer._id,
        name: consumer.name,
        email: consumer.email,
        phone: consumer.phone,
        locationId: consumer.locationId,
        meterId: consumer.meterId || null,
        serialNumber: consumer.serialNumber || null,
        blockId: consumer.blockId || null,
        role: consumer.role,
        createdAt: consumer.createdAt,
      },
    });

  } catch (error) {
    console.error("Create consumer error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =================================
   ADMIN: GET ALL CONSUMERS
=================================*/
export const getAllConsumers = async (req, res) => {
  try {
    const consumers = await User.find({ role: "consumer", isActive: true })
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


/* =================================
   ADMIN: UPDATE CONSUMER
=================================*/
export const updateConsumer = async (req, res) => {
  try {
    delete req.body.role; // prevent role modification

    if (!req.body.password || req.body.password.trim() === "") {
      delete req.body.password;
    } else {
      // If password is provided → hash it
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, role: "consumer" },
      { $set: req.body },   // better practice
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


/* =================================
   ADMIN: DELETE CONSUMER
=================================*/
export const deleteConsumer = async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: "consumer",
      },
      {
        $set: { isActive: false },
      },
      { new: true } // return updated document
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Consumer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Consumer deactivated successfully",
      data: updated,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getConsumerById = async (req, res) => {
  try {
    const consumer = await User.findOne({
      _id: req.params.id,
      role: "consumer",
      isActive: true,
    }).select("-password");

    if (!consumer) {
      return res.status(404).json({
        success: false,
        message: "Consumer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: consumer,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};