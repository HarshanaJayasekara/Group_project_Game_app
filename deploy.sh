#!/usr/bin/env bash

# 1. Error Handling (Optional, but recommended)
set -e  # Exit the script if any command fails

# 2. Prepare build artifacts
pnpm build # Run the build and wait for completion

# 3. Create the Staging Directory
staging_dir="staging"
datetime=$(date +"%Y-%m-%d_%H-%M-%S")
tarball_name="app_deployment_$datetime.tar"

if [ -d "$staging_dir" ]; then  # Check if the directory exists
  trash-put "$staging_dir" 
fi

mkdir -p "$staging_dir/build"
mkdir -p "$staging_dir/node_modules/better-sqlite3"

# 4. Copy 'build/' Folder and Deps
# cp -r build/ "$staging_dir"
rsync -a build/ "$staging_dir/build"

# rsync -a node_modules/better-sqlite3/ "$staging_dir/node_modules/better-sqlite3"

# 5. Copy Root-level Files
# cp package.json pnpm-lock.yaml captain-definition Dockerfile "$staging_dir"
rsync -a package.json pnpm-lock.yaml captain-definition Dockerfile .npmrc "$staging_dir"

# 6. Create 'server' Subdirectory
mkdir -p "$staging_dir/server/src"

# 7. Copy Files to 'server' Subdirectory
# cp server/src/index.ts server/package.json server/pnpm-lock.yaml "$staging_dir/server"
rsync -a server/package.json server/pnpm-lock.yaml server/.npmrc "$staging_dir/server"
rsync -a server/src/index.ts "$staging_dir/server/src"

# 8. Create the Tarball
mkdir -p "deployments"
tar -I 'gzip -9' -cvf "deployments/$tarball_name" -C "$staging_dir" .

echo "Tarball build complete"

# 9. Optional local image build for portability
if [ "$1" == "build" ]; then
    # Assuming the staging dir is where your Dockerfile is located
    cd "$staging_dir"

    image_name="game"
    timestamp=$(date +"%Y%m%d_%H%M%S")
		# timestamp="20240316_133750"
		# current_dir=$(pwd)
    image_tag="${image_name}:${timestamp}"

    docker build -t "$image_tag" .

		# Image moving logic
		image_location="$(docker image inspect --format='{{range .RepoTags}}{{.}}{{"\n"}}{{end}}' "$image_tag")"
 		output_path="../deployments/${image_name}_${timestamp}.tar.gz"
		echo "Saving image..."
		echo "$image_location"
		echo "$output_path"
    docker save "$image_location" -o "$output_path"
fi
