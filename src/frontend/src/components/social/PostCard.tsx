import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import type { Post } from '../../backend';
import { useGetUserProfile } from '../../hooks/useQueries';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { data: authorProfile } = useGetUserProfile(post.author.toString());

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {authorProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{authorProfile?.displayName || 'Unknown User'}</p>
              <p className="text-sm text-muted-foreground">
                @{authorProfile?.username || 'unknown'}
              </p>
            </div>
          </div>
        </div>

        {post.images.length > 0 && (
          <div className="relative">
            {post.images.length === 1 ? (
              <img
                src={post.images[0]}
                alt="Post"
                className="w-full object-cover"
                style={{ maxHeight: '500px' }}
              />
            ) : (
              <Carousel className="w-full">
                <CarouselContent>
                  {post.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <img
                        src={image}
                        alt={`Post image ${index + 1}`}
                        className="w-full object-cover"
                        style={{ maxHeight: '500px' }}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            )}
          </div>
        )}

        <div className="p-4">
          <p className="whitespace-pre-wrap break-words">{post.caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}
