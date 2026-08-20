/** @type {import('tailwindcss').Config} */
module.exports = {
    // Scan toàn bộ src/ để bao gồm shared components, features, v.v.
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // Primary – "#84AFEB" từ Figma Variable Collection
                primary: {
                    DEFAULT: "#84AFEB",
                    light:   "#B8D0F5",
                    dark:    "#5B8FD0",
                },
                // Neutral tokens từ Figma
                neutral: {
                    50:  "#F3F4F6",
                    100: "#FFFFFF",
                    200: "#E5E7EB",
                    700: "#374151",
                },
                // Gradient nền toàn app – "Gradientsss" từ Figma
                gradient: {
                    start: "#DFE1FF",
                    mid:   "#F0D2C1",
                    end:   "#FFE1C4",
                },
            },
        },
    },
    plugins: [],
}