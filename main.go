package main

import (
	"context"
	"fmt"
	"os"
	"time"
)

// writeTestFile creates a test file with the given content
func writeTestFile(filename, content string) error {
	return os.WriteFile(filename, []byte(content), 0644)
}

// readTestFile reads the content of a test file
func readTestFile(filename string) (string, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func main() {
	os.Stdout.WriteString("Hello world from tinygo\n")

	// Test environment variables
	os.Setenv("WASI_TEST_VAR", "test_value")
	envValue := os.Getenv("WASI_TEST_VAR")
	os.Stdout.WriteString(fmt.Sprintf("Environment variable: %s\n", envValue))

	if err := writeTestFile("test.js", envValue); err != nil {
		panic(err)
	}

	data, err := readTestFile("test.js")
	if err != nil {
		panic(err)
	}

	os.Stdout.WriteString("Successfully wrote and read file: " + string(data) + "\n")

	ctx, ctxCancel := context.WithCancel(context.Background())
	defer ctxCancel()

	for {
		select {
		case <-ctx.Done():
		case <-time.After(time.Second):
		}

		os.Stdout.WriteString("Timer: " + time.Now().String() + "\n")
	}
}
