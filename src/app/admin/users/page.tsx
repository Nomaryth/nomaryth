
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, query, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, TriangleAlert } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  location?: string;
  bio?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: 'en' | 'pt';
}

function EditUserDialog({ user, isOpen, onOpenChange, onUserUpdate }: { user: UserData | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onUserUpdate: (updatedUser: UserData) => void }) {
    const [formData, setFormData] = useState<Partial<UserData>>({});
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                bio: user.bio || '',
                location: user.location || '',
                role: user.role || 'user',
            });
        }
    }, [user]);

    const handleChange = (field: keyof Pick<UserData, 'displayName' | 'bio' | 'location' | 'role'>, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!user || !auth.currentUser) return;
        setIsSaving(true);
        try {
            const idToken = await auth.currentUser.getIdToken();
            
            // Call for role update
            const roleRes = await fetch('/api/set-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    targetUid: user.uid,
                    isAdmin: formData.role === 'admin',
                })
            });

            if (!roleRes.ok) throw new Error('Failed to update user role.');

            // Call for other data updates
            const profileRes = await fetch('/api/set-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    targetUid: user.uid,
                    updateData: {
                        displayName: formData.displayName,
                        bio: formData.bio,
                        location: formData.location,
                    }
                })
            });
            
             if (!profileRes.ok) throw new Error('Failed to update user profile.');


            const updatedUserForUI: UserData = {
              ...user,
              ...formData
            }

            onUserUpdate(updatedUserForUI);
            toast({ title: "User Updated", description: "User information has been successfully saved." });
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating user:", error);
            const errorMessage = error instanceof Error ? error.message : "Could not save user changes.";
            toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User: {user.displayName}</DialogTitle>
                    <DialogDescription>Modify the details for this user. Role changes require a user to log out and log back in to take effect.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="displayName" className="text-right">Name</Label>
                        <Input id="displayName" value={formData.displayName || ''} onChange={(e) => handleChange('displayName', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bio" className="text-right">Bio</Label>
                        <Textarea id="bio" value={formData.bio || ''} onChange={(e) => handleChange('bio', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">Location</Label>
                        <Input id="location" value={formData.location || ''} onChange={(e) => handleChange('location', e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [permissionError, setPermissionError] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();
    const { user: currentAdmin } = useAuth();


    useEffect(() => {
        async function fetchUsers() {
            if (!db) {
                console.error("Firestore not initialized for UsersPage");
                setLoading(false);
                return;
            };
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef);
                const usersSnapshot = await getDocs(q);
                const usersList = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserData[];
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users:", error);
                setPermissionError(true);
                toast({ variant: "destructive", title: "Fetch Failed", description: "Could not fetch user list. Check Firestore rules and permissions." });
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, [toast]);

    const handleEdit = (user: UserData) => {
        setSelectedUser(user);
        setIsEditDialogOpen(true);
    };

    const handleDelete = (user: UserData) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;
        toast({ variant: "destructive", title: "Deletion Disabled", description: "For safety, direct user deletion via the admin panel is disabled. Please remove users directly from the Firebase console." });
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
    };
    
    const handleUserUpdate = (updatedUser: UserData) => {
        setUsers(prev => prev.map(u => u.uid === updatedUser.uid ? updatedUser : u));
    };


    const LoadingSkeleton = () => (
        <TableBody>
            {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </TableCell>
                    <TableCell className="font-medium">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-40" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-8 w-8" />
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>A list of all registered users in the system. Changes to roles require the user to log out and back in.</CardDescription>
                </CardHeader>
                <CardContent>
                    {permissionError && (
                         <Alert variant="destructive" className="mb-4">
                            <TriangleAlert className="h-4 w-4" />
                            <AlertTitle>Permission Denied</AlertTitle>
                            <AlertDescription>
                                Your current Firestore security rules do not allow listing users. This is expected if you are using rules that only allow users to access their own data. The user list will be empty.
                            </AlertDescription>
                         </Alert>
                    )}
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                    <span className="sr-only">Image</span>
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="hidden md:table-cell">Location</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        {loading ? <LoadingSkeleton /> : (
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="hidden sm:table-cell">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User'} />
                                                <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="font-medium">{user.displayName || 'Unnamed User'}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                {user.role === 'admin' ? 'Admin' : 'User'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{user.location || 'Not set'}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                <Button
                                                    aria-haspopup="true"
                                                    size="icon"
                                                    variant="ghost"
                                                    disabled={user.uid === currentAdmin?.uid}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEdit(user)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user)}>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        )}
                    </Table>
                     {!loading && users.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            {permissionError ? 'User data cannot be displayed.' : 'No users found.'}
                        </div>
                    )}
                </CardContent>
            </Card>
            <EditUserDialog 
                user={selectedUser} 
                isOpen={isEditDialogOpen} 
                onOpenChange={setIsEditDialogOpen} 
                onUserUpdate={handleUserUpdate}
            />
             <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        For security, this action is disabled in the UI. Please delete users directly from the Firebase Authentication console.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Understood</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
