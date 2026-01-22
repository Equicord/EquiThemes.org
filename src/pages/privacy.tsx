import React from "react";
import { Card, CardContent } from "@components/ui/card";
import { Check } from "lucide-react";
import Head from "next/head";

export default function PrivacyPolicy() {
    const lastUpdated = new Date("2024-11-08T18:24:10.692Z");

    return (
        <>
            <Head>
                <meta name="viewport" content="initial-scale=1, width=device-width" />
                <meta name="keywords" content="discord themes privacy policy, theme library privacy, data protection, user privacy, discord customization privacy" />
                <meta name="theme-color" content="#1a1b26" />
                <meta name="application-name" content="Theme Library" />
                <meta name="description" content="Learn about Theme Library's privacy policy, data collection practices, and how we protect your information when using our Discord theme platform." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://themes.equicord.org/" />
                <meta property="og:title" content="Privacy Policy | Theme Library" />
                <meta property="og:description" content="Read our privacy policy to understand how Theme Library handles your data and protects your privacy when using our Discord theme platform." />
                <title>Privacy Policy | Theme Library</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className="">
                <main className="max-w-4xl mx-auto px-4 py-12">
                    <div className="space-y-12">
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy</h1>
                            <p className="text-lg text-muted-foreground">
                                Your privacy is important to us. Learn how we collect, use, and protect your information.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Last updated: {lastUpdated.toLocaleDateString()}
                            </p>
                        </div>

                        <div className="grid gap-8">
                            <section>
                                <Card className="border-border/40">
                                    <CardContent className="p-8">
                                        <h2 className="text-2xl font-semibold mb-6">Introduction</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            This Privacy Policy explains how Theme Library ("we," "us," or "our") collects, uses, and protects your information when you use our service. We are committed to maintaining your privacy and providing transparency about our data practices.
                                        </p>
                                    </CardContent>
                                </Card>
                            </section>

                            <section>
                                <Card className="border-border/40">
                                    <CardContent className="p-8">
                                        <h2 className="text-2xl font-semibold mb-6">Data Collection</h2>
                                        <p className="text-muted-foreground mb-6 leading-relaxed">
                                            We collect limited information through Discord's OAuth authentication process. We do not sell your personal data to any third parties.
                                        </p>

                                        <div className="bg-muted/30 rounded-xl p-6 border border-border/30">
                                            <h3 className="text-xl font-semibold mb-4">Information We Collect</h3>
                                            <p className="text-muted-foreground mb-4">
                                                When you authorize with Discord, we store the following data:
                                            </p>
                                            <div className="grid gap-3">
                                                {[
                                                    "Discord User ID",
                                                    "Username and display name",
                                                    "Avatar image",
                                                    "Preferred accent color",
                                                    "GitHub connection status (if available)"
                                                ].map((item) => (
                                                    <div key={item} className="flex items-center gap-3">
                                                        <div className="bg-primary/10 p-1 rounded-full">
                                                            <Check className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="text-sm font-medium">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <p className="text-muted-foreground mt-6">
                                            Learn more about Discord's data sharing in their{" "}
                                            <a 
                                                href="https://discord.com/developers/docs/topics/oauth2" 
                                                className="text-primary hover:underline font-medium"
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                            >
                                                official OAuth documentation
                                            </a>.
                                        </p>
                                    </CardContent>
                                </Card>
                            </section>

                            <section>
                                <Card className="border-border/40">
                                    <CardContent className="p-8">
                                        <h2 className="text-2xl font-semibold mb-6">How We Use Your Data</h2>
                                        <p className="text-muted-foreground mb-4 leading-relaxed">
                                            The information we collect is used exclusively for:
                                        </p>
                                        <ul className="space-y-3 text-muted-foreground">
                                            {[
                                                "Providing and maintaining our service",
                                                "User authentication and account management",
                                                "Displaying your profile within the platform",
                                                "Managing theme submissions and attributions",
                                                "Improving user experience and platform functionality"
                                            ].map((item, index) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <div className="bg-muted rounded-full p-1 mt-1">
                                                        <div className="w-1.5 h-1.5 bg-foreground rounded-full"></div>
                                                    </div>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </section>

                            <section>
                                <Card className="border-border/40">
                                    <CardContent className="p-8">
                                        <h2 className="text-2xl font-semibold mb-6">Data Protection</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            We implement industry-standard security measures to protect your personal information. Your data is stored securely using encryption and is only accessible to authorized personnel for maintenance and support purposes.
                                        </p>
                                    </CardContent>
                                </Card>
                            </section>

                            <section>
                                <Card className="border-border/40">
                                    <CardContent className="p-8">
                                        <h2 className="text-2xl font-semibold mb-6">Your Rights</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            You have complete control over your personal information. You can request access to, correction of, or deletion of your data at any time. To manage your data, visit your Account Settings accessible via the profile menu. 
                                        </p>
                                        <p className="text-muted-foreground mt-4 leading-relaxed">
                                            If you need assistance or cannot access your account, contact us at{" "}
                                            <a 
                                                href="mailto:privacy@equicord.org" 
                                                className="text-primary hover:underline font-medium"
                                            >
                                                privacy@equicord.org
                                            </a>.
                                        </p>
                                    </CardContent>
                                </Card>
                            </section>
                        </div>

                        <div className="border-t border-border/40 pt-8">
                            <Card className="border-border/30">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold mb-3">Privacy Policy History</h3>
                                    <p className="text-muted-foreground text-sm">
                                        Previous versions of our Privacy Policy will be archived and displayed here for transparency.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
