
import { GradientHeader } from "@/components/ui/gradient-header";
import { UserCog, User, Mail, Shield, Building2, Calendar } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function ProfilePage() {
    const session = await getSession();

    if (!session) {
        return <div>Please log in to view profile.</div>
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <GradientHeader
                module="settings"
                title="User Profile"
                description="Manage your account settings and preferences"
                icon={UserCog}
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your account details and identification.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={session.image || ""} />
                                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                    {session.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-lg font-medium">{session.name}</h3>
                                <p className="text-sm text-muted-foreground">{session.email}</p>
                            </div>
                        </div>
                        
                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" /> User ID
                                </div>
                                <code className="text-xs bg-muted px-2 py-1 rounded">{session.userId}</code>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Shield className="h-4 w-4" /> Role
                                </div>
                                <Badge variant="outline" className="capitalize">{session.role}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>Your company and workspace information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building2 className="h-4 w-4" /> Company ID
                                </div>
                                <code className="text-xs bg-muted px-2 py-1 rounded">{session.companyId}</code>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" /> Account Created
                                </div>
                                <span className="text-sm">
                                    {/* Placeholder as we don't have created_at in session yet, or fetch from DB */}
                                    {new Date().toLocaleDateString()} 
                                </span>
                            </div>
                        </div>
                         
                        <div className="mt-8 rounded-md bg-amber-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Shield className="h-5 w-5 text-amber-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-amber-800">Security Note</h3>
                                    <div className="mt-2 text-sm text-amber-700">
                                        <p>
                                            Password changes and sensitive account modifications must be done by an administrator via the User Management panel.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
