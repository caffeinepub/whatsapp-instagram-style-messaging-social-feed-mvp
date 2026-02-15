import { useState } from 'react';
import { useCreatePost } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { validateCaption, validateImageUrls } from '../validation/validators';

export default function CreatePostPage() {
  const [caption, setCaption] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [errors, setErrors] = useState<{ caption?: string; images?: string }>({});
  
  const createPostMutation = useCreatePost();
  const navigate = useNavigate();

  const handleAddImageUrl = () => {
    if (imageUrls.length < 10) {
      setImageUrls([...imageUrls, '']);
    }
  };

  const handleRemoveImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const captionError = validateCaption(caption);
    const filteredUrls = imageUrls.filter(url => url.trim() !== '');
    const imagesError = validateImageUrls(filteredUrls);
    
    if (captionError || imagesError) {
      setErrors({
        caption: captionError,
        images: imagesError,
      });
      return;
    }
    
    setErrors({});
    try {
      await createPostMutation.mutateAsync({ caption, images: filteredUrls });
      navigate({ to: '/' });
    } catch (err) {
      setErrors({ caption: err instanceof Error ? err.message : 'Failed to create post' });
    }
  };

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <h1 className="text-2xl font-bold">Create Post</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>New Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="What's on your mind?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className={errors.caption ? 'border-destructive' : ''}
              />
              {errors.caption && (
                <p className="text-sm text-destructive">{errors.caption}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Images (optional, up to 10)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddImageUrl}
                  disabled={imageUrls.length >= 10}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Image
                </Button>
              </div>
              
              {imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="/assets/generated/image.png"
                    value={url}
                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  />
                  {imageUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveImageUrl(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {errors.images && (
                <p className="text-sm text-destructive">{errors.images}</p>
              )}
            </div>

            {createPostMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createPostMutation.error instanceof Error
                    ? createPostMutation.error.message
                    : 'Failed to create post. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/' })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
