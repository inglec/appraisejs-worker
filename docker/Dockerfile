# Use official Node runtime as a parent image.
FROM node:11.9

ARG PROJECT_DIR

# Set the working directory.
WORKDIR /container

# Copy the current directory contents into the container.
COPY . /container

# Install any packages specified in the project's package.json.
RUN npm install --prefix $PROJECT_DIR

# Make port 80 available to the world outside this container.
EXPOSE 80

# Define environment variables.
ENV NODE_PATH $PWD
ENV PROJECT_DIR $PROJECT_DIR

# Run app when the container launches.
CMD npm start --prefix $PROJECT_DIR
