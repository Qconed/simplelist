#!/bin/bash

# Find all directories that do not contain any subdirectories (leaf nodes)
find . -type d | while read -r dir; do
    if [ -z "$(find "$dir" -mindepth 1 -type d)" ]; then
        # Extract the name of the directory
        folder_name=$(basename "$dir")
        
        # Navigate to the parent directory to run the command 
        # so the component is generated inside the leaf folder
        echo "Processing leaf directory: $dir"
        
        # Run the Angular command
        # Using --skip-import might be useful depending on your project structure
        ng g c "$dir/${folder_name}-component"
    fi
done
