import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      locationId: user.locationId
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export default generateToken;
