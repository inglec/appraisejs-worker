# Use official Node runtime as a parent image
FROM node:8.10

# Set the working directory
WORKDIR /container

# Copy the current directory contents into the container
COPY . /container

# Set environment variables
ARG DEBUG
ENV DEBUG $DEBUG
ARG HOST_PORT
ENV HOST_PORT $HOST_PORT

# Fetch up-to-date runner process from GitHub and install dependencies
ARG RUNNER_URL
RUN git clone $RUNNER_URL runner
RUN npm install --production --prefix runner

# Fetch project to be benchmarked from GitHub and install dependencies
ARG PROJECT_URL
RUN git clone $PROJECT_URL project
ARG PROJECT_COMMIT=master
RUN git -C project reset --hard $PROJECT_COMMIT
RUN npm install --prefix project

# Run runner process when the container launches
CMD npm start --prefix runner -- --path=/container/project --hostPort=$HOST_PORT
