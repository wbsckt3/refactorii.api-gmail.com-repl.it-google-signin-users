const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

//const Schema = mongoose.Schema;

const googleSigninUserSchema = new Schema({
  _id: { type: Types.ObjectId, auto: true },
  //poner acá el payload degoogle Sinin console
  FullName: String,
  GivenName: String,
  FamilyName: String,
  FechaIngreso: String,
  ImageURL: String,
  Email: String,
});
googleSigninUserSchema.index({ Email: 1 });
module.exports = mongoose.model("GoogleSigninUser", googleSigninUserSchema);
