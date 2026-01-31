import {Request, Response} from 'express'
import User from '../models/User.js';
import bcrypt from 'bcrypt';

// Controllers for user registration
export const registerUser = async(req: Request, res: Response)=>{
    try{
        const {name, email, password} = req.body;
        //find user by email
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({message: 'User already exist'})
        }

        // Encrypt the password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)
        
        const newUser = new User({name, email, password: hashedPassword})
        await newUser.save();

        // setting user data in session
        req.session.isLoggedIn=true;
        req.session.userId = newUser._id;

        return res.json({
            message: 'Account Created Successfully',
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        })
    }
    catch(err:any){
        console.log(err);
        res.status(500).json({message: err.message})
    }
}

// Controllers for user login

export const LoginUser = async(req: Request, res: Response)=>{
    try {

        const {email, password} = req.body;

        //find user by email
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: 'Invalid Email or Password'})
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({message: 'Invalid Email or Password'})

        }


        // setting user data in session
        req.session.isLoggedIn=true;
        req.session.userId = user._id;


        return res.json({
            message: 'Login Successful Created Successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        })
        
    } catch (err:any) {
         console.log(err);
        res.status(500).json({message: err.message})
    }
}

// Controllers for user log out

export const logoutUser = async(req: Request, res: Response)=>{
    req.session.destroy((err:any)=>{
        if(err){
            console.log(err);
            return res.status(500).json({message: err.message})
        }
        return res.status(200).json({message: 'Logout Successful'})
    })
}

// Controllers for user verify
export const verifyUser = async(req: Request, res: Response)=>{
    try {
        const {userId} = req.session;
        const user = await User.findById(userId).select('-password');

        if(!user){
            return res.status(400).json({message:'Invalid User'})
        }

        return res.json({user});

    } catch (err:any) {
        console.log(err);
        return res.status(500).json({message: err.message})
    }
}