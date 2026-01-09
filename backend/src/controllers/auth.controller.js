import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email)
    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    // 2. Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // 3. Check active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated' });
    }
    
    // 4. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // 5. Generate token
    const token = generateToken(user);
    
    // 6. Send response
     
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        locationId: user.locationId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
