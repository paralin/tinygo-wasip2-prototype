package main

import (
	"os"
	"time"
)

func main() {
	os.Stdout.WriteString("Hello world from tinygo with Atomics.wait-based time.Sleep\n")

	for {
		os.Stdout.WriteString("=== starting atomics wait experiment ===\n")

		os.Stdout.WriteString("Before sleep: " + time.Now().String() + "\n")
		time.Sleep(time.Second)
		os.Stdout.WriteString("After sleep: " + time.Now().String() + "\n")
	}
}
