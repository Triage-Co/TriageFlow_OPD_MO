/** @type {import('tailwindcss').Config} */
module.exports = {
    // Scan toàn bộ src/ để bao gồm shared components, features, v.v.
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#EFF6FF",
                    100: "#DBEAFE",
                    400: "#60A5FA",
                    500: "#5B9BD5",
                    600: "#2563EB",
                },
            },
        },
    },
    plugins: [],
}