import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Key,
  Globe,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { currentUser } from '@/data/mockData';
import { useAlertSoundSetting } from '@/hooks/useAlertSoundSetting';
import { playCriticalAlertSound } from '@/lib/alertSounds';

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const { soundEnabled, setSoundEnabled } = useAlertSoundSetting();
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account preferences and security settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue={currentUser.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue={currentUser.lastName} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" defaultValue={currentUser.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Contact IT to change your email address
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </div>

          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Role & Permissions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Current Role</p>
                  <p className="text-xs text-muted-foreground">Your access level in the system</p>
                </div>
                <span className="text-sm font-medium text-foreground capitalize">{currentUser.role}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Seniority Level</p>
                  <p className="text-xs text-muted-foreground">Your position in the hierarchy</p>
                </div>
                <span className="text-sm font-medium text-foreground capitalize">{currentUser.seniority}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Pole Access</p>
                  <p className="text-xs text-muted-foreground">Poles you can access</p>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {currentUser.poles.length} poles
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive browser notifications</p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Critical Alerts</p>
                  <p className="text-xs text-muted-foreground">Always receive critical alerts</p>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Sons d'alerte</p>
                  <p className="text-xs text-muted-foreground">Jouer un son lors des alertes critiques Ethics & Gateway</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => playCriticalAlertSound()}
                    title="Tester le son"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch
                  checked={twoFactor}
                  onCheckedChange={setTwoFactor}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Change Password</p>
                  <p className="text-xs text-muted-foreground">Update your login credentials</p>
                </div>
                <Button variant="outline" size="sm">
                  <Key className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Active Sessions</p>
                  <p className="text-xs text-muted-foreground">Manage your active logins</p>
                </div>
                <Button variant="outline" size="sm">View Sessions</Button>
              </div>
            </div>
          </div>

          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Audit Log</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your recent account activity is logged for security purposes.
            </p>
            <Button variant="outline">View Full Audit Log</Button>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6 mt-6">
          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Display Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Language</p>
                  <p className="text-xs text-muted-foreground">Select your preferred language</p>
                </div>
                <Button variant="outline" size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  English
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Timezone</p>
                  <p className="text-xs text-muted-foreground">Your local timezone</p>
                </div>
                <span className="text-sm text-muted-foreground">Europe/Paris (UTC+1)</span>
              </div>
            </div>
          </div>

          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Help & Support</h3>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                View Documentation
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                Contact IT Support
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
