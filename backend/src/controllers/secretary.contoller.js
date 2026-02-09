import User from '../models/User.js';

/**
 * Create Secretary
 */
export const createSecretary = async (req, res) => {
  try {
    const { name, email, phone, meterId, locationId } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const secretary = await User.create({
      name,
      email,
      phone,
      meterId,
      locationId,
      role: 'secretary',
    });

    res.status(201).json(secretary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all Secretaries
 */
export const getAllSecretaries = async (req, res) => {
  try {
    const secretaries = await User.find({ role: 'secretary' });
    res.json(secretaries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get Secretary by ID
 */
export const getSecretaryById = async (req, res) => {
  try {
    const secretary = await User.findOne({
      _id: req.params.id,
      role: 'secretary',
    });

    if (!secretary) {
      return res.status(404).json({ message: 'Secretary not found' });
    }

    res.json(secretary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update Secretary
 */
export const updateSecretary = async (req, res) => {
  try {
    const secretary = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'secretary' },
      req.body,
      { new: true, runValidators: true }
    );

    if (!secretary) {
      return res.status(404).json({ message: 'Secretary not found' });
    }

    res.json(secretary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete Secretary
 */
export const deleteSecretary = async (req, res) => {
  try {
    const secretary = await User.findOneAndDelete({
      _id: req.params.id,
      role: 'secretary',
    });

    if (!secretary) {
      return res.status(404).json({ message: 'Secretary not found' });
    }

    res.json({ message: 'Secretary deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
