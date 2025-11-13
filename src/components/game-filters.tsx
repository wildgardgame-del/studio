'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";

interface GameFiltersProps {
    genres: string[];
    selectedGenres: string[];
    onGenreChange: (genres: string[]) => void;
    sortOrder: string;
    onSortOrderChange: (order: string) => void;
    isAgeVerified: boolean;
    showAdultContent: boolean;
    onShowAdultContentChange: (show: boolean) => void;
}

export function GameFilters({
    genres,
    selectedGenres,
    onGenreChange,
    sortOrder,
    onSortOrderChange,
    isAgeVerified,
    showAdultContent,
    onShowAdultContentChange
}: GameFiltersProps) {
    const handleGenreChange = (genre: string, checked: boolean) => {
        const newSelectedGenres = checked
            ? [...selectedGenres, genre]
            : selectedGenres.filter(g => g !== genre);
        onGenreChange(newSelectedGenres);
    };

    return (
        <Card className="sticky top-20">
            <CardHeader>
                <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-4">Sort by</h3>
                    <Select value={sortOrder} onValueChange={onSortOrderChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select sorting" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="price-asc">Price: Low to High</SelectItem>
                            <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div>
                    <h3 className="font-semibold mb-4">Genres</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {genres.map(genre => (
                            <div key={genre} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`genre-${genre}`}
                                    checked={selectedGenres.includes(genre)}
                                    onCheckedChange={(checked) => handleGenreChange(genre, !!checked)}
                                />
                                <Label htmlFor={`genre-${genre}`} className="font-normal cursor-pointer">
                                    {genre}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {isAgeVerified && (
                    <>
                        <Separator />
                        <div>
                             <h3 className="font-semibold mb-4">Content Preferences</h3>
                             <div className="flex items-center justify-between rounded-lg border p-3">
                                <Label htmlFor="adult-content-switch" className="flex flex-col space-y-1">
                                    <span>Show Adult Content</span>
                                    <span className="font-normal leading-snug text-muted-foreground text-xs">
                                        Display games intended for mature audiences.
                                    </span>
                                </Label>
                                <Switch
                                    id="adult-content-switch"
                                    checked={showAdultContent}
                                    onCheckedChange={onShowAdultContentChange}
                                />
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
