const User = require('../models/User'); // importing the user file from the models
const bcrypt = require('bcryptjs'); // importing bcrypt.js for managing the password with security measures like hashed passwords
const jwt = require('jsonwebtoken'); // importing jsonwebtoken for providing the token to each user upon successful login

// Creating a signup function for handling signup endpoint and handles the user registration
exports.signup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists by email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hashing the password before saving the user
        const hashedPassword = await bcrypt.hash(password, 10);

        // Creating a new user object and saving it to the database
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        // Returning a success message with user ID
        res.status(201).json({ message: 'User created successfully', user_id: newUser._id });
    } catch (error) {
        // Handling MongoDB duplicate key error (E11000) and other errors
        console.error(error); // Log the error for better debugging
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        res.status(400).json({ error: error.message });
    }
};

// This function will handle the login endpoint and manages user authentication
exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Ensure the email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide both email and password' });
        }

        // Finding the user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Checking if the provided password matches the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect email or password' });

        // Generating a JWT token upon successful authentication
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Returning success message and the token
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error); // Log the error for better debugging
        res.status(400).json({ error: error.message });
    }
};
