# Use official Node runtime as a parent image
FROM node:8.10

# Path to project to be benchmarked
ARG DEBUG
ARG HOST_PORT
ARG PROJECT_COMMIT=master
ARG PROJECT_URL
ARG RUNNER_URL

# Set the working directory
WORKDIR /container

# Copy the current directory contents into the container
COPY . /container

# Fetch up-to-date runner process from GitHub and install dependencies
RUN git clone $RUNNER_URL runner
RUN npm install --production --prefix runner

# Fetch project to be benchmarked from GitHub and install dependencies
RUN git clone $PROJECT_URL project
RUN git -C project reset --hard $PROJECT_COMMIT
RUN npm install --prefix project

# Set environment variables
ENV DEBUG $DEBUG
ENV HOST_PORT $HOST_PORT

# Run runner process when the container launches
CMD npm start --prefix runner -- --path=/container/project --hostPort=$HOST_PORT
