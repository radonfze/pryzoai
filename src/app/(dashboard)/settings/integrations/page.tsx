"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { Save, ShieldCheck, CreditCard, MessageSquare } from "lucide-react";

export default function IntegrationsPage() {
    const [wpsId, setWpsId] = useState("");
    const [stripeKey, setStripeKey] = useState("");
    const [twilioSid, setTwilioSid] = useState("");
    const [activeTab, setActiveTab] = useState<"gov" | "payment" | "messaging">("gov");

    const handleSave = () => {
        // Logic to save to DB settings table (Stub)
        toast.success("Integration settings saved successfully");
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Integrations & External Systems</h1>
            
            <div className="flex space-x-2 border-b pb-2">
                <Button 
                    variant={activeTab === "gov" ? "default" : "outline"} 
                    onClick={() => setActiveTab("gov")}
                >
                    Government (UAE)
                </Button>
                <Button 
                    variant={activeTab === "payment" ? "default" : "outline"} 
                    onClick={() => setActiveTab("payment")}
                >
                    Payment Gateways
                </Button>
                <Button 
                    variant={activeTab === "messaging" ? "default" : "outline"} 
                    onClick={() => setActiveTab("messaging")}
                >
                    Messaging
                </Button>
            </div>

            <div className="mt-6">
                {activeTab === "gov" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" />
                                WPS & FTA Configuration
                            </CardTitle>
                            <CardDescription>Configure Ministry of Labour and Federal Tax Authority settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>WPS Employer ID (MOL)</Label>
                                <Input value={wpsId} onChange={e => setWpsId(e.target.value)} placeholder="e.g. 1234567890123" />
                            </div>
                            <div className="grid gap-2">
                                <Label>WPS Bank Routing Code</Label>
                                <Input placeholder="e.g. 1234 (Bank Code)" />
                            </div>
                             <div className="grid gap-2">
                                <Label>Tax Agency Number (TAN)</Label>
                                <Input placeholder="TRN..." />
                            </div>
                            <Button onClick={handleSave} className="w-fit"><Save className="mr-2 h-4 w-4" /> Save Configuration</Button>
                        </CardContent>
                    </Card>
                )}

                {activeTab === "payment" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Payment Connectors
                            </CardTitle>
                            <CardDescription>Setup Stripe, PayTabs, or Network International.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Stripe Secret Key</Label>
                                <Input type="password" value={stripeKey} onChange={e => setStripeKey(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Stripe Publishable Key</Label>
                                <Input />
                            </div>
                            <div className="grid gap-2">
                                <Label>PayTabs Profile ID</Label>
                                <Input />
                            </div>
                            <Button onClick={handleSave} className="w-fit"><Save className="mr-2 h-4 w-4" /> Save Keys</Button>
                        </CardContent>
                    </Card>
                )}

                {activeTab === "messaging" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                WhatsApp & SMS
                            </CardTitle>
                            <CardDescription>Configure Twilio, MessageBird, or WhatsApp Business API.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Twilio Account SID</Label>
                                <Input value={twilioSid} onChange={e => setTwilioSid(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Twilio Auth Token</Label>
                                <Input type="password" />
                            </div>
                            <div className="grid gap-2">
                                <Label>WhatsApp Business ID</Label>
                                <Input />
                            </div>
                            <Button onClick={handleSave} className="w-fit"><Save className="mr-2 h-4 w-4" /> Save Configuration</Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
