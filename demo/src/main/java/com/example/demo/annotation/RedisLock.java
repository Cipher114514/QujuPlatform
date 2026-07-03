package com.example.demo.annotation;

import java.lang.annotation.*;
import java.util.concurrent.TimeUnit;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RedisLock {

    String key() default "";

    long waitTime() default 3000;

    long leaseTime() default 5000;

    TimeUnit unit() default TimeUnit.MILLISECONDS;
}