import jwt from "jsonwebtoken"

// How long a login lasts. The cookie is renewed while the user keeps using the app
// (see secureRoute), so active users never get logged out.
export const SESSION_DAYS = 30

const Createtoken = (user_id, res) => {
    const token = jwt.sign({ user_id }, process.env.token, { expiresIn: `${SESSION_DAYS}d` })
    res.cookie("jwt", token, {
        httpOnly: true,
        // secure:true,
        sameSite: "strict",
        // Without maxAge the cookie is deleted when the browser closes,
        // while the saved user in localStorage stays and the app looks logged in.
        maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    })
}
export default Createtoken
