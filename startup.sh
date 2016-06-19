#!/bin/bash
sudo docker build -t dashboard . 
sudo docker run -it --rm -p 8888:8888 dashboard
