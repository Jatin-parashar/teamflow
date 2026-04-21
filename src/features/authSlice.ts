import {
  getCurrentAuthUser,
  logIn,
  logOut,
  signUp,
} from "@/firebase/firebaseAuth";
import { firebaseFetch } from "@/firebase/firebaseFetch";
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { RequestStatus, Role, type User } from "./types";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  status: RequestStatus;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  status: RequestStatus.IDLE,
  error: null,
  initialized: false,
};

export const initializeAuth = createAsyncThunk<
  User | null,
  void,
  { rejectValue: string }
>("auth/initialize", async (_, { rejectWithValue }) => {
  try {
    const firebaseUser = await getCurrentAuthUser();

    if (firebaseUser) {
      const userData = await firebaseFetch<Omit<User, "id"> | null>(
        `users/${firebaseUser.uid}.json`
      );

      if (userData) {
        return { id: firebaseUser.uid, ...userData };
      } else {
        return rejectWithValue("User profile not found");
      }
    } else {
      return null;
    }
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to initialize auth");
  }
});

export const login = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const user = await logIn(email, password);
    const uid = user.uid;

    const userData = await firebaseFetch<Omit<User, "id"> | null>(
      `users/${uid}.json`
    );

    if (!userData) {
      return rejectWithValue("User profile not found");
    }

    return { id: uid, ...userData };
  } catch (error: any) {
    return rejectWithValue(error.message || "Login failed");
  }
});

export const register = createAsyncThunk<
  User,
  { name: string; email: string; password: string },
  { rejectValue: string }
>("auth/register", async ({ name, email, password }, { rejectWithValue }) => {
  try {
    const user = await signUp(email, password, name);

    const userData = {
      name,
      email: user.email || "",
      role: Role.MEMBER,
      title: "",
    };

    await firebaseFetch(`users/${user.uid}.json`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });

    return { id: user.uid, ...userData };
  } catch (error: any) {
    return rejectWithValue(error.message || "Registration failed");
  }
});

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logOut();
    } catch (error: any) {
      return rejectWithValue(error.message || "Logout failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    addError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
      state.status = RequestStatus.IDLE;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.status = RequestStatus.LOADING;
        state.initialized = false;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.status = RequestStatus.SUCCEEDED;
        state.initialized = true;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload;
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.status = RequestStatus.FAILED;
        state.initialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload || "Failed to initialize auth";
      })

      .addCase(login.pending, (state) => {
        state.status = RequestStatus.LOADING;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = RequestStatus.SUCCEEDED;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = RequestStatus.FAILED;
        state.error = action.payload || "Login failed";
      })
      .addCase(register.pending, (state) => {
        state.status = RequestStatus.LOADING;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = RequestStatus.SUCCEEDED;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = RequestStatus.FAILED;
        state.error = action.payload || "Registration failed";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.status = RequestStatus.IDLE;
        state.error = null;
        state.initialized = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload || "Logout failed";
      });
  },
});

export const { addError, clearError } = authSlice.actions;
export const authReducer = authSlice.reducer;
