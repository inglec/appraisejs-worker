# Use official Node runtime as a parent image.
FROM node:11.9

# Set the working directory.
WORKDIR /container

# Copy the current directory contents into the container.
COPY . /container

# Install any packages specified in package.json.
RUN npm install

# Make port 80 available to the world outside this container.
EXPOSE 80

# Define environment variables.
# ENV NAME World

# Run app when the container launches.
CMD ["npm", "start"]
