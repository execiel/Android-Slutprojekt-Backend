const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtkey = "temporary_key";
const { userModel } = require("./models/user");

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
    if (!password || !username) return res.json({status: "bad"});

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

    const token = jwt.sign({ id: user._id }, jwtkey);
    console.log("created token");

    // Send token
    res.json({ status: "ok", token: token });
  });
};