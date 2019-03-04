# Use official Node runtime as a parent image
FROM node:8.10

# Path to project to be benchmarked
ARG DEBUG
ARG PROJECT_URL
ARG PROJECT_COMMIT=master
ARG RUNNER_URL

# Set the working directory
WORKDIR /container

# Copy the current directory contents into the container
COPY . /container

# Fetch up-to-date runner process from GitHub and install dependencies
RUN git clone $RUNNER_URL runner
RUN npm install --prefix runner

# Fetch project to be benchmarked from GitHub and install dependencies
RUN git clone $PROJECT_URL project
RUN git -C project reset --hard $PROJECT_COMMIT
RUN npm install --prefix project

# Set environment variables
ENV DEBUG $DEBUG
ENV NODE_PATH /container/runner

# Run runner process when the container launches
CMD DEBUG=$DEBUG npm start --prefix runner -- --path=/container/project
