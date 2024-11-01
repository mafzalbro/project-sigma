const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("./passport-setup");
const flash = require("connect-flash");
const { sequelize, User } = require("./db");
const morgan = require("morgan");
const NodeCache = require("node-cache");

const app = express();
const port = 3000;

// Create a new cache instance
const cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

// Static Files
app.use(express.static("public"));

// Body parser
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

// Session middleware
app.use(
  session({
    secret: "yourSecretKey", // Change this to a more secure secret
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware to load tools globally
// Middleware to load tools globally
app.use((req, res, next) => {
  const toolsDir = path.join(__dirname, "views", "pages", "tools");

  // Function to recursively read directory and its subdirectories
  const getTools = (dir) => {
    const tools = [];
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // If it's a directory, recursively get tools from it
        tools.push({ name: file, tools: getTools(fullPath) });
      } else if (file.endsWith(".ejs")) {
        // If it's an EJS file, add it as a tool
        tools.push({ name: file.replace(".ejs", ""), tools: [] });
      }
    });

    return tools;
  };

  // Load all tools and sub-tools
  const tools = getTools(toolsDir);
  res.locals.tools = tools; // Load tools globally
  res.locals.user = req.user; // Load user globally

  // Extract the current tool and sub-tool from the request path
  const toolPath = req.path.split('/').filter(Boolean); // Split path and filter out empty elements
  res.locals.currentTool = toolPath[1] || null; // Tool name
  res.locals.currentSubTool = toolPath[2] || null; // Sub-tool name
  res.locals.currentInnerTool = toolPath[3] || null; // Inner tool name

  next();
});


// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Set Templating Engine
app.use(expressLayouts);
app.set("layout", "./layouts/main");
app.set("view engine", "ejs");

// SEO enhancements
app.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "sitemap.xml"));
});
app.get("/robots.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "robots.txt"));
});

// Middleware to cache responses for the main pages
const cacheMiddleware = (req, res, next) => {
  // return next();
  const key = req.originalUrl; // Use the original URL as the cache key
  const noCacheUrls = ["/login", "/signup"];
  if (noCacheUrls.some((url) => url.includes(key))) {
    cache.flushAll()
  }

  const cachedResponse = cache.get(key); // Get the cached response
  console.log("serving from cache", key);

  if (cachedResponse) {
    return res.send(cachedResponse); // If cached, send the cached response
  }

  res.sendResponse = res.send; // Store original send function
  res.send = (body) => {
    cache.set(key, body); // Cache the response
    res.sendResponse(body); // Send the response
  };

  next();
};

// Routes for main pages with caching
app.get("/", cacheMiddleware, (req, res) =>
  res.render("pages/home", { title: "Home", user: req.user })
);
app.get("/about", cacheMiddleware, (req, res) =>
  res.render("pages/about", { title: "About", user: req.user })
);
app.get("/contact", cacheMiddleware, (req, res) =>
  res.render("pages/contact", { title: "Contact", user: req.user })
);
app.get("/tools", cacheMiddleware, (req, res) =>
  res.render("pages/explore-tools", { title: "Explore Tools", user: req.user })
);

// Dynamic Tools page with slug
// Dynamic Tools page with up to 4 levels of subpaths
app.get(
  "/tools/:level1/:level2?/:level3?/:level4?", 
  cacheMiddleware, 
  (req, res) => {
    // Capture path segments dynamically
    const { level1, level2, level3, level4 } = req.params;

    // Construct the tool path by joining available path segments
    const toolPathSegments = [level1, level2, level3, level4].filter(Boolean);
    const toolPath = toolPathSegments.join('/');
    const toolPage = `pages/tools/${toolPath}`; // Construct the path for the tool page

    // Check if the tool page exists
    if (fs.existsSync(path.join(__dirname, "views", toolPage + ".ejs"))) {
      res.render(toolPage, {
        title: `Tool - ${toolPathSegments[toolPathSegments.length - 1].replace(/-/g, " ")}`, // Title based on the last segment
        user: req.user,
      });
    } else {
      // Redirect to 404 page if the tool page does not exist
      res.status(404).render("pages/404", { title: "404 Not Found" });
    }
  }
);


// Signup routes
app.get("/signup", (req, res) => {
  res.render("pages/signup", { title: "Signup", error: req.flash("error") });
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await User.create({ username, password: hashedPassword });
    res.redirect("/login");
  } catch (error) {
    req.flash("error", "Username already exists.");
    res.redirect("/signup");
  }
});

// Login routes
app.get("/login", (req, res) => {
  res.render("pages/login", { title: "Login", error: req.flash("error") });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Logout route
app.get("/logout", (req, res) => {
  req.logout((error) => console.log(error));
  res.redirect("/");
});

// 404 page for unmatched routes
app.use((req, res) =>
  res.status(404).render("pages/404", { title: "404 Not Found" })
);

// Start server and sync database
sequelize.sync().then(() => {
  app.listen(port, () =>
    console.log(`App running at http://localhost:${port}`)
  );
});
