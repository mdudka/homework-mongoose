import Article from "../models/article.model.js";
import User from "../models/user.model.js";

export const getArticles = async (req, res, next) => {
  try {
    const { page = 1, limit = 2, title } = req.query;
    const query = {};

    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    const articles = await Article.find(query)
      .populate({
        path: "owner",
        select: "-_id fullName email age",
      })
      .skip(page > 0 ? (page - 1) * limit : 0)
      .limit(limit);

    res.status(200).json(articles);
  } catch (err) {
    next(err);
  }
};

// export const getArticleById = async (req, res, next) => {
//     try {
//
//     } catch (err) {
//         next(err);
//     }
// }

export const createArticle = async (req, res, next) => {
  try {
    const { title, subtitle, description, owner, category } = req.body;
    const user = await User.findById(owner);
    if (!user) {
      return res.status(400).send("User not found");
    }
    const newArticle = new Article({
      title,
      subtitle,
      description,
      owner,
      category,
    });
    await newArticle.save();
    user.numberOfArticles += 1;
    await user.save();

    res.status(201).json(newArticle);
  } catch (err) {
    next(err);
  }
};

export const updateArticleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, description, category } = req.body;
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).send("Article not found");
    }
    const updateFields = { title, subtitle, description, category };
    for (const [key, value] of Object.entries(updateFields)) {
      if (value) {
        article[key] = value;
      }
    }
    await article.save();
    res.status(200).json(article);
  } catch (err) {
    next(err);
  }
};

export const deleteArticleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).send("Article not found");
    }

    const owner = await User.findById(article.owner);

    await Article.deleteOne({ _id: id });
    owner.numberOfArticles -= 1;
    await owner.save();
    res.status(200).send("Article successfully deleted");
  } catch (err) {
    next(err);
  }
};
