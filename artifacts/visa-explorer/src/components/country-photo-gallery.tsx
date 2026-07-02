import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2, X, ZoomIn, Upload, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@workspace/replit-auth-web";
import { ObjectUploader } from "@workspace/object-storage-web";
import {
  useListPhotos,
  getListPhotosQueryKey,
  useCreatePhoto,
  useDeletePhoto,
} from "@workspace/api-client-react";
import type { TravelPhoto } from "@workspace/api-client-react";

interface CountryPhotoGalleryProps {
  countryCode: string;
  countryName: string;
}

export default function CountryPhotoGallery({ countryCode, countryName }: CountryPhotoGalleryProps) {
  const { isAuthenticated, login, user } = useAuth();
  const queryClient = useQueryClient();

  const [lightbox, setLightbox] = useState<TravelPhoto | null>(null);
  const [pendingCaption, setPendingCaption] = useState("");
  const [pendingObjectPath, setPendingObjectPath] = useState<string | null>(null);
  const [showCaptionModal, setShowCaptionModal] = useState(false);

  const { data, isLoading } = useListPhotos(
    { countryCode: countryCode.toUpperCase(), limit: 24 },
    { query: { queryKey: getListPhotosQueryKey({ countryCode: countryCode.toUpperCase(), limit: 24 }) } }
  );
  const photos = data?.photos ?? [];

  const createPhoto = useCreatePhoto({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey({ countryCode: countryCode.toUpperCase(), limit: 24 }) });
        setShowCaptionModal(false);
        setPendingCaption("");
        setPendingObjectPath(null);
      },
    },
  });

  const deletePhoto = useDeletePhoto({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey({ countryCode: countryCode.toUpperCase(), limit: 24 }) });
        setLightbox(null);
      },
    },
  });

  const handleUploadComplete = (objectPath: string) => {
    setPendingObjectPath(objectPath);
    setShowCaptionModal(true);
  };

  const handleSavePhoto = () => {
    if (!pendingObjectPath) return;
    createPhoto.mutate({
      data: {
        countryCode: countryCode.toUpperCase(),
        objectPath: pendingObjectPath,
        caption: pendingCaption.trim() || undefined,
      },
    });
  };

  return (
    <section className="mt-10 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">
            Photos from {countryName}
          </h2>
          {photos.length > 0 && (
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-300">
              {photos.length}
            </span>
          )}
        </div>

        {isAuthenticated ? (
          <ObjectUploader
            maxNumberOfFiles={5}
            maxFileSize={10 * 1024 * 1024}
            onGetUploadParameters={async (file) => {
              const res = await fetch("/api/storage/uploads/request-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
              });
              const data = await res.json() as { uploadURL: string; objectPath: string };
              return { method: "PUT" as const, url: data.uploadURL, headers: { "Content-Type": file.type } };
            }}
            onComplete={(result) => {
              const successful = result.successful ?? [];
              if (successful.length > 0) {
                const resp = successful[0].response as { body?: { objectPath?: string } } | undefined;
                const objectPath = resp?.body?.objectPath;
                if (objectPath) handleUploadComplete(objectPath);
              }
            }}
            buttonClassName="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-sm font-medium text-white transition-colors"
          >
            <Upload className="h-4 w-4" />
            Add photo
          </ObjectUploader>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={login}
            className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
          >
            <Camera className="mr-2 h-4 w-4" />
            Sign in to add photos
          </Button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] py-14">
          <ImageOff className="h-10 w-10 text-white/20" />
          <p className="text-sm text-white/40">No photos yet. Be the first to share one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              currentUserId={user?.id}
              onClick={() => setLightbox(photo)}
            />
          ))}
        </div>
      )}

      {/* Caption modal after upload */}
      {showCaptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1a1025] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-white">Add a caption (optional)</h3>
            <Textarea
              placeholder={`Describe your trip to ${countryName}…`}
              value={pendingCaption}
              onChange={(e) => setPendingCaption(e.target.value)}
              maxLength={300}
              rows={3}
              className="resize-none bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => { setShowCaptionModal(false); setPendingObjectPath(null); setPendingCaption(""); }}
                className="text-white/60"
              >
                Skip
              </Button>
              <Button
                onClick={handleSavePhoto}
                disabled={createPhoto.isPending}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                {createPhoto.isPending ? "Saving…" : "Save photo"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          photo={lightbox}
          currentUserId={user?.id}
          onClose={() => setLightbox(null)}
          onDelete={(id) => deletePhoto.mutate({ id: id })}
          isDeleting={deletePhoto.isPending}
        />
      )}
    </section>
  );
}

function PhotoTile({
  photo,
  currentUserId,
  onClick,
}: {
  photo: TravelPhoto;
  currentUserId?: string;
  onClick: () => void;
}) {
  const imgSrc = `/api/storage${photo.objectPath}`;
  return (
    <button
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-lg bg-white/[0.04] border border-white/5 hover:border-violet-500/30 transition-all"
    >
      <img
        src={imgSrc}
        alt={photo.caption ?? "Travel photo"}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2">
        <div className="flex w-full items-center justify-between">
          {photo.caption && (
            <span className="text-xs text-white/90 line-clamp-1 flex-1 mr-1">{photo.caption}</span>
          )}
          <ZoomIn className="h-4 w-4 text-white/80 shrink-0" />
        </div>
      </div>
      {currentUserId === photo.userId && (
        <div className="absolute top-1 right-1 rounded bg-violet-600/80 px-1 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
          yours
        </div>
      )}
    </button>
  );
}

function Lightbox({
  photo,
  currentUserId,
  onClose,
  onDelete,
  isDeleting,
}: {
  photo: TravelPhoto;
  currentUserId?: string;
  onClose: () => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  const imgSrc = `/api/storage${photo.objectPath}`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full rounded-xl overflow-hidden bg-[#110d1a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imgSrc}
          alt={photo.caption ?? "Travel photo"}
          className="w-full max-h-[70vh] object-contain"
        />
        {photo.caption && (
          <div className="px-4 py-3 text-sm text-white/70">{photo.caption}</div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {currentUserId === photo.userId && (
            <button
              onClick={() => onDelete(photo.id)}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 px-2 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg bg-black/50 hover:bg-black/80 p-1.5 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
