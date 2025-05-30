const User = require('../models/User');
const nodemailer = require('nodemailer');

exports.sendCredentials = async (req, res) => {
    const { type, userId, password } = req.body;
    if (!userId || !password || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
        const newUser = new User({ type, email: userId, password });
        await newUser.save();
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: { user: 'gptcustom63@gmail.com', pass: 'xygn rtkv ezkq pzzy' },
            logger: true, debug: true,
        });
        const mailOptions = {
            from: 'gptcustom63@gmail.com',
            to: userId,
            type,
            subject: 'Your Login Credentials',
            text: `Hello,\n\nHere are your login credentials:\nType: ${type}\nUser ID: ${userId}\nPassword: ${password}\n\nThank you,\nCustom GPT Team`,
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent and user saved successfully' });
    } catch (error) {
        console.error('Error:', error);
        if (error.response) console.error('Nodemailer Response:', error.response);
        res.status(500).json({ message: 'Failed to send email or save user' });
    }
};

exports.login = async (req, res) => {
    const { email, password, userType } = req.body;
    const type = userType.toLowerCase();
    if (!email || !password || !userType) {
        return res.status(400).json({ message: 'Email, password, and user type are required' });
    }
    try {
        const user = await User.findOne({ email, password, type });
        if (user) {
            return res.status(200).json({ message: 'Login successful', type });
        } else {
            return res.status(401).json({ message: 'Invalid credentials or user type' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password, type } = req.body;
        const updatedUser = await User.findByIdAndUpdate(id, { email, password, type }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
}; 