const express = require("express");
const mongoose = require("mongoose");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// También podemos usar la librería de variables de entorno dotenv
// BD ATLAS con retosalgoritmos@gmail.com
const mySecret = process.env["MONGO_URI"];
const uri =
  "mongodb+srv://admin:mibJpnwaMkPUodEg@clasemongo2023.lqqrxbx.mongodb.net/test?retryWrites=true&w=majority";
// conectamos la BD con el mySecret
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("DB connected"))
  .catch((err) => console.error(err));

// importamos el modelo mongoose en el archivo models.js:
const GoogleSigninUser = require("./GoogleSigninUser");

// esquema GraphQl: encargado de definir el tipo de consulta hacia la BD
// al definir los types en los resolvers e invocarlos en este esquema
// ambos quedan disponibles en graphiql
const schema = buildSchema(`

  type GoogleSigninUser {
    _id: ID
    FullName: String
    GivenName: String
    FamilyName: String
    FechaIngreso: String
    ImageURL: String
    Email: String
  }

  type Query {      
    oneGoogleSigninUser(_id: ID!): GoogleSigninUser
    allGoogleSigninUsers: [GoogleSigninUser]
    oneGoogleSigninUserByEmail(Email: String!): [GoogleSigninUser]
  }

  type Mutation {   
      crearGoogleSigninUser ( 
        FullName: String
        GivenName: String
        FamilyName: String
        FechaIngreso: String
        ImageURL: String
        Email: String
      ): GoogleSigninUser

      deleteGoogleSigninUserById(_id: ID!): String

      updateGoogleSigninUser(
        _id: ID!
        FullName: String
        GivenName: String
        FamilyName: String
        FechaIngreso: String
        ImageURL: String
        Email: String
      ): GoogleSigninUser

  }

`);

// resolvers: encargados de recuperar a través del modelo obtener aquí para manipular o exponer el resultado de las consultas
const rootValue = {
  crearGoogleSigninUser: async ({
    FullName,
    GivenName,
    FamilyName,
    FechaIngreso,
    ImageURL,
    Email,
  }) => {
    const newGoogleSigninUser = new GoogleSigninUser({
      FullName,
      GivenName,
      FamilyName,
      FechaIngreso,
      ImageURL,
      Email,
    });
    await newGoogleSigninUser.save();
    return newGoogleSigninUser.toObject();
  },

  allGoogleSigninUsers: async () => {
    try {
      // Recupera todos los GoogleSigninUsers
      const GoogleSigninUsers = await GoogleSigninUser.find();
      console.log(GoogleSigninUsers);
      return GoogleSigninUsers;
    } catch (error) {
      throw new Error("No se pudieron recuperar los GoogleSigninUsers.");
    }
  },

  oneGoogleSigninUser: async (_, { _id }) => {
    try {
      // Recupera u por su ID
      const GoogleSigninUser = await GoogleSigninUser.findOne(_id);
      return GoogleSigninUser;
    } catch (error) {
      throw new Error("No se pudo encontrar el GoogleSigninUser.");
    }
  },

  oneGoogleSigninUserByEmail: async ({ Email }) => {
    try {
      // Recupera u por su contacto
      console.log({ Email });
      const googleSigninUser = await GoogleSigninUser.find({
        Email: Email,
      });
      if (googleSigninUser.length === 0) {
        throw new Error("No se encontraron GoogleSigninUsers con ese Email.");
      }
      return googleSigninUser;
    } catch (error) {
      console.log(error);
      throw new Error("No se pudo encontrar el GoogleSigninUser por Email.");
    }
  },

  /*getUserRecipes: async (root, { username }, { Recipe }) => {
    const userRecipes = await Recipe.find({ username }).sort({
      createdDate: "desc"
    });
    return userRecipes;
  },*/

  deleteGoogleSigninUserById: async (_, { _id }) => {
    try {
      // Intenta borrar el GoogleSigninUser por su ID
      const deletedGoogleSigninUser = await GoogleSigninUser.deleteOne(_id);
      1;
      if (!deletedGoogleSigninUser) {
        // Si el GoogleSigninUser no existe, lanza un error
        throw new Error("No se encontró e.");
      }

      return `GoogleSigninUser con ID ${_id} borrado correctamente.`;
    } catch (error) {
      console.error("Error al borrar e:", error);
      throw new Error("No se pudo borrar e.");
    }
  },

  updateGoogleSigninUser: async ({
    _id,
    FullName,
    GivenName,
    FamilyName,
    FechaIngreso,
    ImageURL,
    Email,
  }) => {
    try {
      const existingGoogleSigninUser = await GoogleSigninUser.findOne({ _id });

      if (!existingGoogleSigninUser) {
        throw new Error("No se encontró e.");
      }

      const updatedGoogleSigninUser = await GoogleSigninUser.findOneAndUpdate(
        { _id },
        {
          $set: {
            FullName,
            GivenName,
            FamilyName,
            FechaIngreso,
            ImageURL,
            Email,
          },
        },
        { new: true },
      );

      return updatedGoogleSigninUser;
    } catch (error) {
      console.error("Error al actualizar e:", error);
      throw new Error("No se pudo actualizar e.");
    }
  },
};

app.use(cors());
app.use(bodyParser.json());

// Esta es la definición de la ruta de graphql:
// https://conexionbdmongo.mapatagbusqueda.repl.co/graphql
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue,
    graphiql: true,
  }),
);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});
app.get("/index-admin-gsg", function (req, res) {
  res.sendFile(__dirname + "/index-admin-gsg.html");
});
app.get("/index2.html", function (req, res) {
  res.sendFile(__dirname + "/index2.html");
});
app.get("/js/calendar.js", function (req, res) {
  res.sendFile(__dirname + "/js/calendar.js");
});
app.get("/css/calendar.css", function (req, res) {
  res.sendFile(__dirname + "/css/calendar.css");
});

// endpoint API de consumo desde postman o JS Fetch tienda virtual
/*const test = require("./data");
app.get("/products", (req, res) =>
  res.json({ total: test.length, status: 200, test }),
);*/

//------------------------
// Ruta de API para cargar data no desde el archivo data.js sino desde el resolver allGoogleSigninUsers que trae la data de la BD
// instalamos el paquete esm (ecma script modules)
// este paquete nos ayuda a cargar node-fetch como modulo.
// Por la versión de node que tenemos instalada: 18.16.1 debemos
// utilizar import
// https://23913d9f-9a23-4b9c-9311-875072a4c064-00-3b5jrh193tc3d.kirk.replit.dev/GoogleSigninUsersFromGraphQL
// este endpoint nos permite hacer el fetch desde javascript al endpoint incluida la consulta graphiql
require = require("esm")(module);
// importamos la librería node-fetch
import("node-fetch")
  .then(({ default: fetch }) => {
    // definimos la ruta de la API
    app.get("/GoogleSigninUsersFromGraphQL", async (req, res) => {
      try {
        const graphqlResponse = await fetch("http://localhost:3000/graphql", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            query:
              "{ allGoogleSigninUsers{ _id, FullName, GivenName, FamilyName, FechaIngreso, ImageURL, Email }}",
          }),
        });

        const { data, errors } = await graphqlResponse.json();

        if (errors) {
          throw new Error("Error en la consulta Graphql");
        }

        res.json({
          total: data.allGoogleSigninUsers.length,
          status: 200,
          GoogleSigninUsers: data.allGoogleSigninUsers,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error del api en el servidor" });
      }
    });
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ error: "Error en el import con node-fetch" });
  });

// Crear un GoogleSigninUser desde fetch javascript en html
require = require("esm")(module);
import("node-fetch")
  .then(({ default: fetch }) => {
    // Definimos la ruta de la API para POST
    app.post("/postOneGoogleSigninUser", async (req, res) => {
      try {
        // Obtener datos del cuerpo de la solicitud
        const {
          FullName,
          GivenName,
          FamilyName,
          FechaIngreso,
          ImageURL,
          Email,
        } = req.body;
        // Construir la consulta GraphQL con los datos recibidos
        const graphqlQuery = `
            mutation {
              crearGoogleSigninUser(
                FullName: "${FullName}"
                GivenName: "${GivenName}"
                FamilyName: "${FamilyName}"
                FechaIngreso: "${FechaIngreso}"
                ImageURL: "${ImageURL}"
                Email: "${Email}"
              ) {
                FullName, GivenName, FamilyName, FechaIngreso, ImageURL, Email
              }
            }
          `;
        // Enviar la consulta GraphQL al servidor
        const graphqlResponse = await fetch("http://localhost:3000/graphql", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: graphqlQuery }),
        });
        const { data, errors } = await graphqlResponse.json();
        if (errors) {
          console.error("Errores en la consulta GraphQL:", errors);
          throw new Error("Error en la consulta GraphQL");
        }
        // Enviar la respuesta al cliente
        res.json({
          status: 200,
          GoogleSigninUser: data.crearGoogleSigninUser,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ error: "Error en el import con node-fetch" });
  });

// obtener todos los registros de un GoogleSigninUser desde javascript
require = require("esm")(module);
import("node-fetch")
  .then(({ default: fetch }) => {
    // Definir la ruta de la API para GET
    app.get("/getOneGoogleSigninUser/:Email", async (req, res) => {
      try {
        const { Email } = req.params;
        console.log(Email);

        // Construir la consulta GraphQL con los datos recibidos
        const graphqlQuery = `
             query {
               oneGoogleSigninUserByEmail(Email: "${Email}") {
                 _id,
                 FullName,
                 GivenName,
                 FamilyName,
                 FechaIngreso
                 ImageURL,
                 Email,
               }
             }
           `;

        // Enviar la consulta GraphQL al servidor
        const graphqlResponse = await fetch("http://localhost:3000/graphql", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: graphqlQuery }),
        });

        const { data, errors } = await graphqlResponse.json();

        if (errors) {
          console.error("Errores GraphQL:", errors);
          throw new Error("Error en la consulta GraphQL");
        }

        // Enviar la respuesta al cliente
        res.json({
          status: 200,
          GoogleSigninUser: data.oneGoogleSigninUserByEmail,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ error: "Error en el import con node-fetch" });
  });

// Actualizar un GoogleSigninUser desde javascript
require = require("esm")(module);
import("node-fetch")
  .then(({ default: fetch }) => {
    // Definimos la ruta de la API para POST
    app.post("/updateOneGoogleSigninUser", async (req, res) => {
      try {
        // Obtener datos del cuerpo de la solicitud
        const {
          _id,
          FullName,
          GivenName,
          FamilyName,
          FechaIngreso,
          ImageURL,
          Email,
        } = req.body;
        // Construir la consulta GraphQL con los datos recibidos
        const graphqlQuery = `
            mutation {
              updateGoogleSigninUser(
                _id: "${_id}"
                FullName: "${FullName}"
                GivenName: "${GivenName}"
                FamilyName: "${FamilyName}"
                FechaIngreso: "${FechaIngreso}"
                ImageURL: "${ImageURL}"
                Email: "${Email}"
              ) {
                _id,
                FullName,
                GivenName,
                FamilyName,
                FechaIngreso,
                ImageURL,
                Email,
              }
            }
          `;
        // Enviar la consulta GraphQL al servidor
        const graphqlResponse = await fetch("http://localhost:3000/graphql", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: graphqlQuery }),
        });
        const { data, errors } = await graphqlResponse.json();
        if (errors) {
          console.error("Errores en la consulta GraphQL:", errors);
          throw new Error("Error en la consulta GraphQL");
        }
        // Enviar la respuesta al cliente
        res.json({
          status: 200,
          updatedGoogleSigninUser: data.updateGoogleSigninUser,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ error: "Error en el import con node-fetch" });
  });

app.listen(3000, () => {
  console.log("Server started on port 4000");
});
