export const interestActions = {
  tech: { label: "Explore his applications", href: "#work", motion: "build" },
  business: { label: "Follow his experience", href: "#experience", motion: "build" },
  editing: { label: "Explore his visual stories", href: "#reels", motion: "play" },
  design: { label: "See his creative interests", href: "#about", motion: "draw" },
  photo: { label: "Explore his visual stories", href: "#reels", motion: "shutter" },
  video: { label: "Explore his visual stories", href: "#reels", motion: "play" },
  writing: { label: "Get to know his interests", href: "#about", motion: "draw" },
  cooking: { label: "Follow the coffee process", href: "#coffee", motion: "warm" },
  travel: { label: "Explore his visual stories", href: "#reels", motion: "travel" },
  finance: { label: "See what he wants to learn", href: "#about", motion: "build" },
  economics: { label: "See what he wants to learn", href: "#about", motion: "balance" },
} as const;

export const coffeeActions = ["Release the beans", "Work the grinder", "Pour the water", "Pour the milk", "Stir the cup", "Let the steam rise"] as const;
