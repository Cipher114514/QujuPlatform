package com.example.demo.aspect;

import com.example.demo.annotation.RedisLock;
import com.example.demo.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Aspect
@Component
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class RedisLockAspect {

    private final RedissonClient redissonClient;

    private static final Pattern PATTERN = Pattern.compile("\\{(.*?)\\}");

    @Around("@annotation(com.example.demo.annotation.RedisLock)")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        RedisLock redisLockAnnotation = method.getAnnotation(RedisLock.class);

        String key = generateKey(redisLockAnnotation.key(), joinPoint);
        long waitTime = redisLockAnnotation.waitTime();
        long leaseTime = redisLockAnnotation.leaseTime();

        RLock lock = redissonClient.getLock(key);
        boolean acquired = false;

        try {
            acquired = lock.tryLock(waitTime, leaseTime, redisLockAnnotation.unit());
            if (acquired) {
                log.debug("Acquired Redis lock: {}", key);
                return joinPoint.proceed();
            } else {
                throw new BusinessException(429, "操作过于频繁，请稍后重试");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Redis lock error: {}", e.getMessage(), e);
            throw new BusinessException(500, "系统繁忙，请稍后重试");
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) {
                lock.unlock();
                log.debug("Released Redis lock: {}", key);
            }
        }
    }

    private String generateKey(String keyTemplate, ProceedingJoinPoint joinPoint) {
        if (keyTemplate.isEmpty()) {
            return joinPoint.getSignature().toShortString();
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] paramNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        Matcher matcher = PATTERN.matcher(keyTemplate);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String paramName = matcher.group(1);
            Object paramValue = null;

            for (int i = 0; i < paramNames.length; i++) {
                if (paramNames[i].equals(paramName)) {
                    paramValue = args[i];
                    break;
                }
            }

            matcher.appendReplacement(sb, paramValue != null ? String.valueOf(paramValue) : "null");
        }
        matcher.appendTail(sb);

        return sb.toString();
    }
}