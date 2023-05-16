import mongoose from "mongoose";

import User from "../models/user.model.js";
import Article from "../models/article.model.js";

export const getUsers = async (req, res, next) => {
  try {
    const sortingOrder = req.query.age === "desc" ? -1 : 1;
    const users = await User.find({}, { fullName: 1, email: 1, age: 1 }).sort({
      age: sortingOrder,
    });
    return res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const getUserByIdWithArticles = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: "articles",
          localField: "_id",
          foreignField: "owner",
          as: "articles",
        },
      },
      {
        $project: {
          fullName: 1,
          email: 1,
          age: 1,
          articles: {
            $map: {
              input: "$articles",
              as: "article",
              in: {
                title: "$$article.title",
                subtitle: "$$article.subtitle",
                createdAt: "$$article.createdAt",
              },
            },
          },
        },
      },
    ]);
    if (!user.length) {
      return res.status(404).json("User not found");
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, role, age, numberOfArticles } =
      req.body;
    const newUser = new User({
      firstName,
      lastName,
      email,
      role,
      age,
      numberOfArticles,
    });
    const result = await newUser.save();
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, age } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { firstName, lastName, age },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    updatedUser.fullName = `${firstName} ${lastName}`;
    await updatedUser.save();

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    await User.deleteOne({ _id: id });
    await Article.deleteMany({ owner: id });

    res
      .status(200)
      .send("The user and all his articles have been successfully deleted");
  } catch (err) {
    next(err);
  }
};
