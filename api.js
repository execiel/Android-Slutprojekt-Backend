const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtkey = "temporary_key";
const { userModel } = require("./models/user");
const { postModel } = require("./models/post");

module.exports = async (app) => {
  // Handle user registration
  app.post("/api/registerUser", async (req, res) => {
    // Grab username and password from request
    const { username, password } = req.body;

    // Verify information
    if (typeof password != "string" || typeof username != "string")
      return res.status(400).send();
    if (!password || !username) return res.status(400).send();

    // Encrypt password
    const hashedPassword = bcrypt.hashSync(password, 12);

    try {
      // Create user
      await userModel.create({
        username,
        password: hashedPassword,
        description: "New user",
      });

      console.log("created new user!");
      // Send ok status
      res.status(200).send();
    } catch (e) {
      console.log(e.code);
      res.status(400).send();
    }
  });

  // Handle user login
  app.post("/api/loginUser", async (req, res) => {
    const { username, password } = req.body;

    // Verify information
    if (typeof password != "string" || typeof username != "string")
      return res.json({ status: "bad" });
    if (!password || !username) return res.json({ status: "bad" });

    // Find user in db
    const user = await userModel.findOne({ username }).lean();

    // if no user was found return with error message
    if (!user) return res.json({ status: "bad" });
    console.log("found user");

    // see if passwords match
    if (!(await bcrypt.compare(password, user.password))) {
      console.log("passwords didnt match");
      return res.json({ status: "bad" });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, jwtkey);
    console.log("created token");

    // Send token
    res.json({ status: "ok", token: token });
  });

  app.delete("/api/deletePost", async (req, res) => {
    const { token, id } = req.body;

    try {
      // Grab post from id
      post = await postModel.findById(id);

      // Grab user from token
      user = await getUserFromToken(token)

      // Verify if user owns post
      if(user._id.toString() != post.author.toString()) {
        console.log("unauthorized deletion attempt")
        // Unauthorized request
        return res.status(401).send()
      }

      // Delete post
      await postModel.deleteOne({_id: id})

      console.log("Deleted post")

      // Return updated post list after deletion
      const userPosts = await postModel.find({ author: user._id }).exec();

      return res.json({ posts: userPosts });
    } catch (e) {
      console.log(e)
      return res.status(400).send()
    }
  });
  
  app.put("/api/editPost", async (req, res) => {
    // Grab inforamtion from client
    const {token, id, title, content} = req.body;

    if(title == "" || content == "")
      return res.status(400).send;
    
    if(title.length > 200 || content.length > 1000 )
      return res.status(400).send;
    
    try {
      // Grab post from id
      post = await postModel.findById(id);

      // Grab user from token
      user = await getUserFromToken(token)

      console.log("found user and post");

      // Verify if user owns post
      if(user._id.toString() != post.author.toString()) {
        console.log("unauthorized deletion attempt")
        // Unauthorized request
        return res.status(401).send()
      }

      // Update post
      post.title = title;
      post.content = content;
      await post.save();
      console.log("Saved post")

      // Return updated post list after deletion
      const userPosts = await postModel.find({ author: user._id }).exec();

      return res.json({ posts: userPosts });
    } catch (e) {
      console.log(e)
      return res.status(400).send()
    }

  })

  // Gets users own posts from token
  app.post("/api/getHome", async (req, res) => {
    const { token } = req.body;

    try {
      const user = await getUserFromToken(token);

      const userPosts = await postModel.find({ author: user._id }).exec();

      return res.json({ posts: userPosts });
    } catch (e) {
      console.log(e);
      return res.status(400).send();
    }
  });

  app.post("/api/addPost", async (req, res) => {
    const { token, title, content } = req.body;

    console.log(req.body);

    // Verify information
    if (title.length > 200) {
      return res.status(400).send();
    }
    if (content.length > 1000) {
      return res.status(400).send();
    }
    if (!content || !title) {
      return res.status(400).send();
    }

    console.log("trying to add post");

    try {
      // Get user
      const user = await getUserFromToken(token);

      // Create a new post
      await postModel.create({
        author: user._id,
        title,
        content,
      });

      console.log("Added post");

      // Send ok status to client
      res.status(200).send();
    } catch (e) {
      res.status(417).send();
      console.log(e);
    }
  });

  async function getUserFromToken(token) {
    const user = await userModel.findById(jwt.verify(token, jwtkey).id);
    return user;
  }
};
