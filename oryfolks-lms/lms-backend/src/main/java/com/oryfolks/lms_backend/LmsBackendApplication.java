package com.oryfolks.lms_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.boot.autoconfigure.domain.EntityScan(basePackages = "com.oryfolks.lms_backend.entity")
@org.springframework.data.jpa.repository.config.EnableJpaRepositories(basePackages = "com.oryfolks.lms_backend.repository")
public class LmsBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(LmsBackendApplication.class, args);
	}

}
