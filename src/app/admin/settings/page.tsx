
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Settings</CardTitle>
        <CardDescription>
          Configure global settings for the admin panel and application.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
            <Settings className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
            <h3 className="text-xl font-semibold mb-2">Under Construction</h3>
            <p className="text-muted-foreground">
                This section for administrator settings is coming soon.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
