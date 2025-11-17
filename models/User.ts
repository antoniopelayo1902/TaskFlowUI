import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { Role } from "@/lib/roles";

export type IUser = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: Role;
  passwordHash?: string; // opcional si la cuenta es solo por proveedor (Google)
  providerIds?: {
    google?: string; // sub de Google
    // otros proveedores si aplican
  };
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true, index: true },
    role: {
      type: String,
      enum: ["admin", "manager", "developer"],
      required: true,
      default: "developer",
    },
    passwordHash: { type: String },
    providerIds: {
      google: { type: String },
    },
  },
  { timestamps: true }
);

// Transformación para que coincida con el tipo User del front (id: string)
UserSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.passwordHash; // nunca exponer el hash
    return ret;
  },
});

// Evitar recompilar el modelo en hot-reload
export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

// Tipo inferido a partir del Schema (si lo necesitas)
export type UserDoc = InferSchemaType<typeof UserSchema>;
