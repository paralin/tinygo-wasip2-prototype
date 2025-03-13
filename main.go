package main

import (
	"os"
	"time"
)

func main() {
	os.Stdout.WriteString("Hello world from tinygo\n")

	for {
		time.Sleep(time.Second)
		os.Stdout.WriteString(time.Now().String() + "\n")
	}
}
